import React from 'react';

const SalesVideo = () => {
  return (
    <div className="video-container">
      <video 
        // autoPlay 
        loop 
        playsInline 
        className="sales-video"
        controls
      >
        <source src="https://teal-artistic-bonobo-612.mypinata.cloud/ipfs/QmU91LxHg1Q1heiPxGZsbcqKSQHegNuRKFotwAG2NrTLyf" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default SalesVideo;
