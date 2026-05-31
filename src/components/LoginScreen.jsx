import React from 'react';

export function LoginScreen({ onLogin, error }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 text-center relative">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg bg-neutral-900/60 backdrop-blur-xl rounded-3xl border border-neutral-800 p-8 md:p-12 shadow-2xl space-y-8 relative overflow-hidden transition-all duration-300 hover:border-neutral-700/80">
        
        {/* Brand Header */}
        <div className="space-y-4">
          <div className="flex justify-center">
            {/* Custom Spotify-like logo icon */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-neutral-950 font-bold text-3xl shadow-lg shadow-emerald-500/20">
              ♫
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Spotify Recommender
            </h1>
            <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
              Discover co-listening hidden gems you've never heard before.
            </p>
          </div>
        </div>

        {/* Informational Cards */}
        <div className="grid grid-cols-1 gap-4 text-left pt-2">
          {[
            {
              title: "Co-Listening Engine",
              desc: "Leverages Last.fm similarity data to find artists highly correlated with your favorites."
            },
            {
              title: "100% Client-Side",
              desc: "No database, no AI, and no background storage. Your credentials and history remain strictly in your browser."
            },
            {
              title: "Fresh Music Only",
              desc: "Analyzes your top tracks, recently played list, and library to filter out everything you've already heard."
            }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-800/60 flex items-start gap-3">
              <span className="text-emerald-400 font-bold text-sm shrink-0 mt-0.5">✔</span>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{item.title}</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Login Button Area */}
        <div className="space-y-4 pt-4">
          {error && (
            <p className="text-xs font-semibold text-red-400 bg-red-950/40 border border-red-500/20 py-2.5 px-4 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={onLogin}
            className="w-full py-4 px-6 rounded-full font-bold text-sm uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10 flex items-center justify-center gap-2"
          >
            {/* Simple Spotify Icon SVG */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 .007c-6.627 0-12 5.371-12 12s5.373 12 12 12 12-5.372 12-12-5.373-12-12-12zm5.49 17.31c-.22.359-.685.474-1.037.256-2.877-1.758-6.499-2.156-10.767-1.18-.41.093-.82-.162-.913-.573-.093-.41.162-.82.573-.913 4.67-1.066 8.65-.62 11.888 1.36.353.218.47.684.256 1.04zm1.464-3.264c-.276.45-.86.595-1.305.32-3.293-2.023-8.312-2.61-12.203-1.428-.506.153-1.04-.136-1.193-.642-.153-.507.137-1.04.643-1.193 4.453-1.352 10-1.7 13.8 1.054.444.272.593.856.318 1.306v-.017zm.126-3.395c-3.95-2.346-10.468-2.56-14.25-1.41-.606.184-1.25-.164-1.433-.772-.183-.607.165-1.251.772-1.434 4.34-1.317 11.53-1.07 16.08 1.63.547.324.726 1.03.4 1.578-.323.548-1.03.727-1.57.4z" />
            </svg>
            Connect with Spotify
          </button>
          
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold pt-1">
            Secure, passwordless connection via official Spotify portal
          </p>
        </div>
      </div>
    </div>
  );
}
