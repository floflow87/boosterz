import captainTsubasaPath from "@assets/b2585610-b824-4549-bf16-f1fd4a8f0da0_1750364780097.png";

interface LoadingScreenProps {
  message?: string;
  progress?: number;
}

export default function LoadingScreen({ message, progress }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-blue-900 via-blue-800 to-green-800">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Football field lines */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white transform -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        {/* Floating footballs */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white rounded-full animate-bounce opacity-30"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-white rounded-full animate-bounce opacity-20 delay-300"></div>
        <div className="absolute top-1/2 left-1/6 w-2 h-2 bg-white rounded-full animate-bounce opacity-25 delay-700"></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Captain Tsubasa character */}
        <div className="relative mb-6">
          <div className="w-32 h-32 mx-auto relative">
            {/* Glowing effect behind character */}
            <div className="absolute inset-0 bg-white rounded-full opacity-20 animate-pulse scale-110"></div>
            <div className="absolute inset-0 bg-blue-400 rounded-full opacity-30 animate-ping"></div>
            
            {/* Character image */}
            <img 
              src={captainTsubasaPath}
              alt="Captain Tsubasa"
              className="w-full h-full object-contain relative z-10 animate-bounce"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.8))',
                animationDuration: '2s'
              }}
            />
          </div>
          
          {/* Energy lines around character */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 w-40 h-40 border-2 border-blue-400 rounded-full animate-spin opacity-30 transform -translate-x-1/2 -translate-y-1/2" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-48 h-48 border border-white rounded-full animate-spin opacity-20 transform -translate-x-1/2 -translate-y-1/2" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
          </div>
        </div>
        
        {/* Loading text with anime-style effect */}
        <div className="text-white font-bold text-2xl mb-6 animate-pulse">
          <span className="inline-block animate-bounce" style={{ animationDelay: '0s' }}>C</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>h</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>a</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>r</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>g</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.5s' }}>e</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.6s' }}>m</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.7s' }}>e</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.8s' }}>n</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.9s' }}>t</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '1s' }}>.</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '1.1s' }}>.</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '1.2s' }}>.</span>
        </div>
        
        {/* Custom message */}
        {message && (
          <div className="text-blue-300 text-lg mb-4 animate-pulse">
            {message}
          </div>
        )}
        
        {/* Energy bar */}
        <div className="w-80 h-3 bg-black bg-opacity-30 rounded-full mx-auto overflow-hidden border border-blue-400">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 rounded-full shadow-lg shadow-blue-400/50 transition-all duration-300"
            style={{ 
              width: progress !== undefined ? `${progress}%` : '100%',
              animation: progress !== undefined ? 'none' : 'pulse 2s infinite'
            }}
          ></div>
        </div>
        
        {/* Progress percentage */}
        {progress !== undefined && (
          <div className="mt-2 text-cyan-300 text-sm font-bold">
            {Math.round(progress)}%
          </div>
        )}
        
        {/* Power up effect */}
        <div className="mt-4 text-blue-300 text-sm animate-pulse">
          ⚡ Préparation de votre collection ⚡
        </div>
      </div>
    </div>
  );
}