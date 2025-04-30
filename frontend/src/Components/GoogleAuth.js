// googleLoginButton.js
import React from "react";
const FacebookLoginButton = () => {
  const reachFacebook = () => {
    const clientID = "3737484549889496"; // Vérifiez que cet ID est correct
    const redirectURI = encodeURIComponent("http://localhost:3000/auth/facebook/callback");
    const scope = encodeURIComponent("public_profile email"); // Ordre important
    const authURL = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientID}&redirect_uri=${redirectURI}&scope=${scope}&response_type=code`;
    
    window.location.href = authURL;
  };

  return (
    <button className="btn btn-light border" onClick={reachFacebook}>
      <img src="/images/facebook.png" alt="Google" style={{ width: "20px", marginRight: "10px" }} />
      Continuer avec Facebook
    </button>
  );
};

export default FacebookLoginButton;
