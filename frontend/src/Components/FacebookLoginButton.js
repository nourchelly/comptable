// FacebookLoginButton.js
import React from "react";

const FacebookLoginButton = () => {
  const reachFacebook = () => {
    const appID = "3737484549889496"; // Remplacez par l'ID de votre application Facebook
    const redirectURI = encodeURIComponent("http://localhost:3000/auth/facebook/callback");
    const scope = encodeURIComponent("email public_profile"); // Ajoutez les permissions nécessaires
    const authURL = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appID}&redirect_uri=${redirectURI}&scope=${scope}&response_type=code`;

    window.location.href = authURL;
  };

  return (
    <button className="btn btn-primary border" onClick={reachFacebook}>
      <img src="/images/facebook-logo.png" alt="Facebook" style={{ width: "20px", marginRight: "10px" }} />
      Continuer avec Facebook
    </button>
  );
};

export default FacebookLoginButton;