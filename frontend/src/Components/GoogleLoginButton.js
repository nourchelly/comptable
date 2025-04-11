// googleLoginButton.js
import React from "react";

const GoogleLoginButton = () => {
  const reachGoogle = () => {
    const clientID = "11479995049-09n7oceljn4sgmodv5til5uj7bd072jp.apps.googleusercontent.com";
    const redirectURI = encodeURIComponent("http://localhost:3000/auth/google/callback");
    const scope = encodeURIComponent("email profile");
    const accessType = "offline";
    const prompt = "consent";
    const authURL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientID}&redirect_uri=${redirectURI}&scope=${scope}&access_type=${accessType}&prompt=${prompt}`;
    
    window.location.href = authURL;
  };

  return (
    <button className="btn btn-light border" onClick={reachGoogle}>
      <img src="/images/google-logo.png" alt="Google" style={{ width: "20px", marginRight: "10px" }} />
      Continuer avec Google
    </button>
  );
};

export default GoogleLoginButton;
