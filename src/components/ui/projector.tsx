import React from "react";

const Projector = () => {
  return (
    <div className="relative flex h-40 w-64 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-400 p-4 shadow-lg">
      {/* Black Front Panel */}
      <div className="absolute left-0 top-0 h-full w-2/3 rounded-l-xl bg-black p-4">
        {/* Vents */}
        <div className="space-y-2">
          <div className="h-2 w-16 rounded bg-purple-400"></div>
          <div className="h-2 w-16 rounded bg-purple-400"></div>
          <div className="h-2 w-16 rounded bg-purple-400"></div>
        </div>

        {/* Red Indicator Light */}
        <div className="absolute bottom-4 right-4 h-3 w-3 rounded-full bg-red-500 shadow-md"></div>
      </div>

      {/* Projector Lens */}
      <div className="absolute -right-6 flex h-16 w-16 items-center justify-center rounded-full bg-black shadow-lg">
        <div className="h-12 w-12 rounded-full bg-purple-300 opacity-80"></div>
      </div>

      {/* Top Buttons */}
      <div className="absolute -top-2 left-6 flex items-center space-x-2">
        {/* Small Circular Button */}
        <div className="h-4 w-4 rounded-full bg-black flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-blue-300"></div>
        </div>

        {/* Switch */}
        <div className="h-5 w-8 rounded bg-black"></div>
      </div>
    </div>
  );
};

export default Projector;
