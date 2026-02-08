import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

type SandboxResponse = {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtimeMs: number;
};

@Injectable()
export class SandboxService {
  private readonly endpoint: string;

  constructor(config: ConfigService) {
    this.endpoint = config.get<string>('SANDBOX_URL', 'http://localhost:5051/run');
  }

  async execute(language: 'C' | 'CPP' | 'PYTHON', sourceCode: string, stdin = ''): Promise<SandboxResponse> {
    try {
      const { data } = await axios.post<SandboxResponse>(this.endpoint, {
        language,
        sourceCode,
        stdin
      });
      return data;
    } catch (error) {
      throw new InternalServerErrorException('Sandbox execution failed');
    }
  }
}



















