import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssignment, useSubmitAssignment } from '../../api/hooks';
import { ArrowLeft, Clock, Calendar, Upload, CheckCircle, AlertCircle, FileText, Code, BookOpen, X } from 'lucide-react';

const AssignmentDetailPage = () => {
  const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const classIdNum = classId ? parseInt(classId) : null;
  const assignmentIdNum = assignmentId ? parseInt(assignmentId) : null;
  
  const { data: assignment, isLoading } = useAssignment(classIdNum, assignmentIdNum);
  const submitAssignment = useSubmitAssignment();
  
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number; isOverdue: boolean } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Calculate time remaining
  useEffect(() => {
    if (!assignment?.dueDate) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const due = new Date(assignment.dueDate).getTime();
      const diff = due - now;

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, isOverdue: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [assignment?.dueDate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Preview pentru text files
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.py') || file.name.endsWith('.js') || file.name.endsWith('.ts')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!classIdNum || !assignmentIdNum) return;

    // Dacă assignment-ul are contentId și contentType, navighează la pagina respectivă
    if (assignment?.contentId && assignment?.contentType) {
      if (assignment.contentType === 'QUIZ') {
        navigate(`/quizzes?assignment=${assignmentIdNum}`);
        return;
      } else if (assignment.contentType === 'CODING_EXERCISE') {
        navigate(`/code-lab?assignment=${assignmentIdNum}`);
        return;
      }
    }

    // Pentru upload de fișier (dacă nu are contentId)
    if (selectedFile) {
      // TODO: Implement file upload API
      alert('File upload functionality will be implemented soon');
      return;
    }

    alert('Please select a file or complete the associated quiz/coding exercise');
  };

  const hasSubmission = assignment?.submissions && assignment.submissions.length > 0;
  const latestSubmission = hasSubmission ? assignment.submissions[0] : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading assignment...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Assignment not found</div>
      </div>
    );
  }

  const getContentIcon = () => {
    if (assignment.contentType === 'QUIZ') return <FileText className="h-5 w-5" />;
    if (assignment.contentType === 'CODING_EXERCISE') return <Code className="h-5 w-5" />;
    return <BookOpen className="h-5 w-5" />;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/classes/${classId}`)}
          className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-white">{assignment.title}</h1>
          <p className="text-slate-400 mt-1">{assignment.description}</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Due Date Card */}
        {assignment.dueDate && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-lg ${timeRemaining?.isOverdue ? 'bg-red-500/20' : 'bg-primary/20'}`}>
                <Clock className={`h-6 w-6 ${timeRemaining?.isOverdue ? 'text-red-400' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className="text-sm text-slate-400">Due Date</h3>
                <p className="text-lg font-semibold text-white">
                  {new Date(assignment.dueDate).toLocaleDateString('ro-RO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            {timeRemaining && (
              <div className={`text-2xl font-bold ${timeRemaining.isOverdue ? 'text-red-400' : 'text-primary'}`}>
                {timeRemaining.isOverdue ? (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-6 w-6" />
                    <span>Overdue</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-normal text-slate-400">
                      <span>Time remaining:</span>
                    </div>
                    <div className="flex gap-2">
                      {timeRemaining.days > 0 && (
                        <span className="bg-slate-800 px-3 py-1 rounded-lg">
                          {timeRemaining.days}d
                        </span>
                      )}
                      <span className="bg-slate-800 px-3 py-1 rounded-lg">
                        {String(timeRemaining.hours).padStart(2, '0')}h
                      </span>
                      <span className="bg-slate-800 px-3 py-1 rounded-lg">
                        {String(timeRemaining.minutes).padStart(2, '0')}m
                      </span>
                      <span className="bg-slate-800 px-3 py-1 rounded-lg">
                        {String(timeRemaining.seconds).padStart(2, '0')}s
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Type Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm text-slate-400">Type</h3>
              <p className="text-lg font-semibold text-white">{assignment.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
              assignment.difficulty === 'Beginner' ? 'bg-emerald-500/20 text-emerald-300' :
              assignment.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'
            }`}>
              {assignment.difficulty}
            </span>
          </div>
        </div>

        {/* Submission Status Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-lg ${hasSubmission ? 'bg-emerald-500/20' : 'bg-slate-700/50'}`}>
              <CheckCircle className={`h-6 w-6 ${hasSubmission ? 'text-emerald-400' : 'text-slate-400'}`} />
            </div>
            <div>
              <h3 className="text-sm text-slate-400">Status</h3>
              <p className={`text-lg font-semibold ${hasSubmission ? 'text-emerald-400' : 'text-slate-300'}`}>
                {hasSubmission ? 'Submitted' : 'Not Submitted'}
              </p>
            </div>
          </div>
          {latestSubmission && latestSubmission.submission && (
            <div className="text-sm text-slate-400">
              Score: <span className="text-white font-semibold">
                {latestSubmission.submission.score} / {latestSubmission.submission.maxScore}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Content */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Assignment Details</h2>
        <div className="prose prose-invert max-w-none">
          <p className="text-slate-300 whitespace-pre-wrap">{assignment.description}</p>
        </div>

        {assignment.contentId && assignment.contentType && (
          <div className="mt-6 p-4 rounded-lg border border-slate-700 bg-slate-800/50">
            <div className="flex items-center gap-3 mb-3">
              {getContentIcon()}
              <h3 className="text-lg font-semibold text-white">
                {assignment.contentType === 'QUIZ' ? 'Quiz Assignment' :
                 assignment.contentType === 'CODING_EXERCISE' ? 'Coding Exercise' :
                 'Lesson Material'}
              </h3>
            </div>
            <p className="text-slate-400 mb-4">
              This assignment is linked to a {assignment.contentType === 'QUIZ' ? 'quiz' : 
              assignment.contentType === 'CODING_EXERCISE' ? 'coding exercise' : 'lesson'}.
              Click the button below to complete it.
            </p>
            <button
              onClick={() => {
                if (assignment.contentType === 'QUIZ') {
                  navigate(`/quizzes?assignment=${assignmentIdNum}`);
                } else if (assignment.contentType === 'CODING_EXERCISE') {
                  navigate(`/code-lab?assignment=${assignmentIdNum}`);
                }
              }}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {assignment.contentType === 'QUIZ' ? 'Start Quiz' : 'Open Code Lab'}
            </button>
          </div>
        )}
      </div>

      {/* File Upload Section (dacă nu are contentId) */}
      {!assignment.contentId && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Submit Assignment</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Upload File
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/50 p-6 hover:border-primary/50 transition-colors">
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-slate-300">
                      {selectedFile ? selectedFile.name : 'Click to select file or drag and drop'}
                    </span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.py,.js,.ts,.zip"
                  />
                </label>
                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {filePreview && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">File Preview</h3>
                <pre className="text-xs text-slate-400 whitespace-pre-wrap max-h-64 overflow-auto">
                  {filePreview}
                </pre>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!selectedFile || submitAssignment.isPending}
              className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitAssignment.isPending ? (
                <>Submitting...</>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Submit Assignment
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Submission History */}
      {hasSubmission && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Submission History</h2>
          <div className="space-y-4">
            {assignment.submissions.map((sub: any, index: number) => (
              <div key={index} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm font-semibold text-white">
                      Submitted on {new Date(sub.submittedAt).toLocaleString('ro-RO')}
                    </span>
                  </div>
                  {sub.submission && (
                    <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-sm font-semibold">
                      {sub.submission.score} / {sub.submission.maxScore}
                    </span>
                  )}
                </div>
                {sub.submission?.feedback && (
                  <p className="text-sm text-slate-400 mt-2">{sub.submission.feedback}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetailPage;

