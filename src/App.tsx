/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect } from 'react';
import { db } from './lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

export default function App() {
  useEffect(() => {
    async function testConnection() {
      try {
        // Just checking if we can access firestore
        console.log("Firebase initialized:", db);
      } catch (error) {
        console.error("Firebase connection error:", error);
      }
    }
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-2xl font-bold">CleanSlate Bankruptcy App</h1>
      <p>System initialized.</p>
    </div>
  );
}
