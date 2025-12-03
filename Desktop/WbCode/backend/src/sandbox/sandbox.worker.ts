import { createServer } from 'http';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { spawn } from 'child_process';

type RunRequest = {
  language: 'C' | 'CPP' | 'PYTHON';
  sourceCode: string;
  stdin?: string;
};

const runProcess = (command: string, args: string[], cwd: string, stdin = '') =>
  new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
    const child = spawn(command, args, { cwd, shell: process.platform === 'win32' });
    let stdout = '';
    let stderr = '';

    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });
  });

const runRequest = async ({ language, sourceCode, stdin }: RunRequest) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'wbcode-'));
  const start = Date.now();
  try {
    if (language === 'PYTHON') {
      const fileName = 'main.py';
      await writeFile(path.join(dir, fileName), sourceCode);
      const pythonBin = process.platform === 'win32' ? 'python' : 'python3';
      return await runProcessWithTiming(pythonBin, [fileName], dir, stdin ?? '', start);
    }

    if (language === 'C') {
      const artifact = process.platform === 'win32' ? 'main.exe' : 'main';
      await writeFile(path.join(dir, 'main.c'), sourceCode);
      const compile = await runProcess('gcc', ['main.c', '-std=c11', '-O2', '-o', artifact], dir);
      if (compile.exitCode !== 0) {
        return { ...compile, runtimeMs: Date.now() - start };
      }
      const execName = process.platform === 'win32' ? artifact : `./${artifact}`;
      return await runProcessWithTiming(execName, [], dir, stdin ?? '', start);
    }

    const artifact = process.platform === 'win32' ? 'main.exe' : 'main';
    await writeFile(path.join(dir, 'main.cpp'), sourceCode);
    const compile = await runProcess('g++', ['main.cpp', '-std=c++17', '-O2', '-o', artifact], dir);
    if (compile.exitCode !== 0) {
      return { ...compile, runtimeMs: Date.now() - start };
    }
    const execName = process.platform === 'win32' ? artifact : `./${artifact}`;
    return await runProcessWithTiming(execName, [], dir, stdin ?? '', start);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

const runProcessWithTiming = async (
  command: string,
  args: string[],
  cwd: string,
  stdin: string,
  start: number
) => {
  const result = await runProcess(command, args, cwd, stdin);
  return { ...result, runtimeMs: Date.now() - start };
};

const server = createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const payload: RunRequest = JSON.parse(body);
      const result = await runRequest(payload);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (error) {
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          stdout: '',
          stderr: (error as Error).message,
          exitCode: -1,
          runtimeMs: 0
        })
      );
    }
  });
});

const port = Number(process.env.SANDBOX_PORT || 5051);
server.listen(port, () => {
  console.log(`Sandbox worker ready on port ${port}`);
});

