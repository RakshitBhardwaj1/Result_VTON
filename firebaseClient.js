const firebaseConfig = {
  apiKey: "AIzaSyBOG2ESiaYUWWSxzCO6SwiLfyhW6_P2H7w",
  authDomain: "viton-82524.firebaseapp.com",
  projectId: "viton-82524",
  storageBucket: "viton-82524.appspot.com",
  messagingSenderId: "185785452553",
  appId: "1:185785452553:web:81a15c112346d844dd10d8"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
export { auth };
