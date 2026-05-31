"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { Mic, MicOff, Sparkles, Wand2, Loader2, PlayCircle } from "lucide-react";

export default function MagicMirror() {
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [rhymeText, setRhymeText] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("Tell me a story...");
  
  const recognitionRef = useRef<any>(null);
  const webcamRef = useRef<Webcam>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [audioUrl]);

  const generateRealScene = async (currentTranscript: string) => {
    if (!currentTranscript || currentTranscript === "Tell me a story...") return;
    
    // Capture the child's face!
    const faceImageBase64 = webcamRef.current?.getScreenshot();
    
    setIsGenerating(true);
    setTranscript("Agent is analyzing your face and painting the scene...");
    
    try {
      const response = await fetch("/api/scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transcript: currentTranscript,
          faceImage: faceImageBase64 
        })
      });
      
      const data = await response.json();
      if (data.status === "success") {
        setGeneratedImage(data.image);
        setRhymeText(data.rhyme);
        setAudioUrl(data.audio);
        setTranscript("Magic complete!");
      } else {
        const errorMsg = data.error || "The magic fizzled. Try again!";
        setTranscript(`Error: ${errorMsg}`);
        console.error("Server Error Payload:", data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setTranscript("Connection lost to the magic realm.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      // Trigger the real Managed Agent pipeline!
      generateRealScene(transcript);
    } else {
      setTranscript("Listening... (Speak your story, then click Draw Magic!)");
      setGeneratedImage(null);
      setRhymeText(null);
      setAudioUrl(null);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-950 to-black text-white p-6 sm:p-10 font-sans selection:bg-indigo-500/30 flex flex-col">
      <header className="flex items-center justify-between mb-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.3)] backdrop-blur-xl border border-indigo-500/30">
            <Wand2 className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
              StoryWeaver Live
            </h1>
            <p className="text-indigo-200/70 text-sm font-medium">Interactive Imagination Canvas</p>
          </div>
        </div>
        
        <button
          onClick={toggleListening}
          disabled={isGenerating}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg border disabled:opacity-50 ${
            isListening 
              ? "bg-red-500/20 text-red-300 border-red-500/50 shadow-red-500/20 hover:bg-red-500/30" 
              : "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-indigo-500/20 hover:bg-indigo-500/30"
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-1" />
              Painting...
            </>
          ) : isListening ? (
            <>
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Draw Magic!
              <Wand2 className="w-5 h-5 ml-1" />
            </>
          ) : (
            <>
              Start Magic
              <Mic className="w-5 h-5 ml-1" />
            </>
          )}
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 w-full min-h-[600px]">
        {/* Webcam Panel */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900/50 border border-slate-700/50 backdrop-blur-xl shadow-2xl flex flex-col h-full">
          <div className="absolute top-4 left-4 z-10 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-xs font-semibold text-white/80 border border-white/10 uppercase tracking-widest">
            Camera
          </div>
          <div className="flex-1 w-full h-full relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="absolute inset-0 w-full h-full object-cover"
              mirrored={true}
            />
          </div>
          
          {/* Subtitles / Transcript Area */}
          <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <p className="text-xl md:text-2xl font-medium text-white/90 leading-relaxed text-center drop-shadow-lg">
              {transcript}
            </p>
          </div>
        </div>

        {/* Storybook / Imagination Panel */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900/50 border border-slate-700/50 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center group h-full">
          <div className="absolute top-4 left-4 z-10 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-300 border border-indigo-500/30 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            Imagination
          </div>
          
          {generatedImage ? (
            <>
              <img 
                src={generatedImage} 
                alt="Generated scene" 
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
              />
              
              {rhymeText && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8 opacity-0 hover:opacity-100 transition-opacity duration-500">
                  <div className="bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center shadow-2xl max-w-md">
                    <p className="text-xl md:text-2xl font-medium text-white/90 leading-relaxed drop-shadow-md italic">
                      {rhymeText}
                    </p>
                    {audioUrl && (
                      <div className="mt-4 flex justify-center">
                        <button onClick={() => audioRef.current?.play()} className="p-2 bg-indigo-500/30 hover:bg-indigo-500/50 rounded-full transition-colors border border-indigo-500/50">
                          <PlayCircle className="w-8 h-8 text-indigo-200" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-8 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 animate-pulse">
                {isGenerating ? <Loader2 className="w-10 h-10 text-indigo-400/50 animate-spin" /> : <Sparkles className="w-10 h-10 text-indigo-400/50" />}
              </div>
              <h3 className="text-2xl font-semibold text-slate-300 mb-2">
                {isGenerating ? "Agent is working..." : "Waiting for a story..."}
              </h3>
              <p className="text-slate-500 max-w-sm">
                {isGenerating 
                  ? "The Managed Agent is painting you into the story and writing a magical rhyme!"
                  : "Click 'Start Magic' and tell me a story. I'll paint you into the picture!"}
              </p>
            </div>
          )}
          
          {/* Audio Player (Hidden) */}
          {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
          
          {/* Magic Glow Effect */}
          {generatedImage && (
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(99,102,241,0.2)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20" />
          )}
        </div>
      </main>
    </div>
  );
}
