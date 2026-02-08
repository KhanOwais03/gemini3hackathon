
import React, { useState, useCallback } from 'react';
import { AppStatus, FrameData, TranslationResult } from './types';
import Webcam from './components/Webcam';
import { translateASL, textToSpeech, playPCM } from './services/gemini';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartRecording = () => {
    setError(null);
    setResult(null);
    setStatus(AppStatus.RECORDING);
  };

  const handleCaptureComplete = useCallback(async (frames: FrameData[]) => {
    if (frames.length === 0) {
      setStatus(AppStatus.ERROR);
      setError("No frames captured.");
      return;
    }

    setStatus(AppStatus.ANALYZING);
    try {
      const translation = await translateASL(frames);
      setResult(translation);
      
      setStatus(AppStatus.SPEAKING);
      const audioData = await textToSpeech(translation.text);
      await playPCM(audioData);
      
      setStatus(AppStatus.IDLE);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during translation.");
      setStatus(AppStatus.ERROR);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="max-w-4xl w-full mb-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
          <span className="text-sm font-semibold uppercase tracking-wider">AI Accessibility Engine</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400 mb-4">
          Echo-Sign
        </h1>
        <p className="text-slate-400 max-w-2xl text-lg">
          Breaking barriers between signed and spoken language using Gemini's advanced multimodal vision and text-to-speech.
        </p>
      </header>

      {/* Main Experience */}
      <main className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Webcam & Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Webcam 
            status={status} 
            onCaptureComplete={handleCaptureComplete} 
            recordingDuration={5000}
          />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleStartRecording}
              disabled={status !== AppStatus.IDLE && status !== AppStatus.ERROR}
              className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-xl transition-all duration-300 ${
                status === AppStatus.IDLE || status === AppStatus.ERROR
                  ? 'bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 shadow-xl shadow-indigo-500/20 scale-100 hover:scale-105 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-red-500 group-hover:animate-pulse"></div>
              {status === AppStatus.RECORDING ? 'Recording...' : 'Record 5s Message'}
            </button>
            
            <p className="text-xs text-slate-500 text-center sm:text-left max-w-[200px]">
              Tip: Ensure your hands and face are clearly visible for accurate translation.
            </p>
          </div>
        </div>

        {/* Right Column: Transcription & Data */}
        <div className="space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-full min-h-[400px] flex flex-col">
            <h2 className="text-sm font-bold uppercase text-slate-500 tracking-widest mb-4 flex items-center justify-between">
              Live Transcript
              {result && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                  {Math.round(result.confidence * 100)}% Confidence
                </span>
              )}
            </h2>

            <div className="flex-1 overflow-y-auto">
              {!result && status === AppStatus.IDLE && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm">Waiting for input...</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <p className="font-bold mb-1">Error</p>
                  {error}
                </div>
              )}

              {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="relative p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <div className="absolute -top-3 -left-2 text-4xl text-indigo-500/30">"</div>
                    <p className="text-2xl font-semibold leading-relaxed text-indigo-50">
                      {result.text}
                    </p>
                    <div className="absolute -bottom-6 -right-2 text-4xl text-indigo-500/30">"</div>
                  </div>

                  {result.sentiment && (
                    <div className="flex items-center gap-3 text-sm text-slate-400 bg-slate-800/30 p-3 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-slate-300">Tone Analysis</p>
                        <p>{result.sentiment}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 font-mono">POWERED BY GEMINI 3 FLASH</span>
                  </div>
                </div>
              )}
            </div>
            
            {status === AppStatus.SPEAKING && (
              <div className="mt-4 flex items-center gap-3 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 animate-pulse">
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-indigo-400 rounded-full"></div>
                  <div className="w-1 h-6 bg-indigo-400 rounded-full"></div>
                  <div className="w-1 h-3 bg-indigo-400 rounded-full"></div>
                  <div className="w-1 h-5 bg-indigo-400 rounded-full"></div>
                </div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-tighter">Audio Output Active</p>
              </div>
            )}
          </section>

          {/* Feature Highlight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <p className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Multimodal</p>
              <p className="text-xs text-slate-400 leading-tight">Facial cues analyzed for context</p>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Ultra Low Latency</p>
              <p className="text-xs text-slate-400 leading-tight">Instant speech generation</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 text-slate-600 text-sm">
        <p>&copy; 2024 Echo-Sign • Empowering Silent Communication</p>
      </footer>
    </div>
  );
};

export default App;
