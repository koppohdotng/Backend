// firebase.js

import firebase from 'firebase';
import 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyC90tkFRMCBdE7lnntORfpzCXspsqYuWQk",
    authDomain: "koppoh-4e5fb.firebaseapp.com",
    databaseURL: "https://koppoh-4e5fb-default-rtdb.firebaseio.com",
    projectId: "koppoh-4e5fb",
    storageBucket: "koppoh-4e5fb.appspot.com",
    messagingSenderId: "324777107146",
    appId: "1:324777107146:web:7116f780e1dfb30f1e1e33",
    measurementId: "G-7F0L8GN77J"
  };

  

firebase.initializeApp(firebaseConfig);

export default firebase;
