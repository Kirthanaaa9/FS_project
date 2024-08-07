import { createContext, useContext, useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
    getAuth, createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,
} from 'firebase/auth'
import { getFirestore, getDoc, doc, setDoc } from "firebase/firestore";

const FirebaseContext = createContext(null);

const firebaseConfig = {
    apiKey: import.meta.env.VITE_REACT_APP_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_REACT_APP_FIREBASE_APPID,
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();
const firestore = getFirestore(firebaseApp);

export const useFirebase = () => {
    const firebase = useContext(FirebaseContext);
    if (!firebase) {
        throw new Error("useFirebase must be used within a FirebaseProvider");
    }
    return firebase;
}

export const FirebaseProvider = (props) => {

    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);

    useEffect(() => {
        onAuthStateChanged(firebaseAuth, async (user) => {
            if (user) {
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser(user);
                    setRole(userData.role);
                }
            } else {
                setUser(null);
                setRole(null);
            }
        })
    }, [])


    // useEffect(() => {
    //     const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
    //         if (user) {
    //             const userDocRef = doc(firestore, 'users', user.uid);
    //             const userDoc = await getDoc(userDocRef);
    //             if (userDoc.exists()) {
    //                 const userData = userDoc.data();
    //                 setUser(user);
    //                 setRole(userData.role);
    //             }
    //         } else {
    //             setUser(null);
    //             setRole(null);
    //         }
    //     });

    //     return () => unsubscribe();
    // }, []);

    const addUser = (email, password, name, phno) => {
        createUserWithEmailAndPassword(firebaseAuth, email, password)
            .then((userCredential) => {
                const loggedInuser = userCredential.user;
                const user = {
                    name,
                    phno,
                    userId: loggedInuser.uid,
                    role: "rusers"
                };
                const userDocRef = doc(firestore, 'users', loggedInuser.uid);

                setDoc(userDocRef, user)
                    .then(() => {
                        console.log('User document created with UID: ', loggedInuser.uid);
                    })
                    .catch((error) => {
                        console.error('Error creating user document: ', error);
                    });
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const handleLogout = async () => {
        try {
            await signOut(firebaseAuth);
        } catch (error) {
            console.error('Error occurred during logout:', error);
        }
    };

    const signinUserWithEmailAndPassword = (email, password) => {
        signInWithEmailAndPassword(firebaseAuth, email, password);
    }

    const signinWithGoogle = () => {
        signInWithPopup(firebaseAuth, googleProvider);
    }

    const sendPReset = (email) => {
        sendPasswordResetEmail(firebaseAuth, email);
    }

    const isLoggedIn = user ? true : false;

    return (

        <FirebaseContext.Provider value={{
            signinUserWithEmailAndPassword,
            addUser,
            user,
            role,
            handleLogout,
            signinWithGoogle,
            sendPReset,
            isLoggedIn,
        }}>
            {props.children}
        </FirebaseContext.Provider>
    )
}