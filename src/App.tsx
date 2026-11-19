/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Classroom3DView } from './components/Classroom3DView';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <main className="w-full h-full min-h-screen">
        <Classroom3DView />
      </main>
    </ErrorBoundary>
  );
}
