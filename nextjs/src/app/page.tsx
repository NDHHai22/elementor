'use client';

import { useState } from 'react';
import { htmlToElementorJson } from '@/lib/html-to-json';
import { elementorJsonToHtml } from '@/lib/json-to-html';

export default function Home() {
  const [activeTab, setActiveTab] = useState('html-to-json');
  const [inputValue, setInputValue] = useState('');
  const [outputValue, setOutputValue] = useState('');
  const [error, setError] = useState('');

  const handleConvert = () => {
    setError('');
    setOutputValue('');

    try {
      if (activeTab === 'html-to-json') {
        const elements = htmlToElementorJson(inputValue);
        setOutputValue(JSON.stringify(elements, null, 2));
      } else {
        const elements = JSON.parse(inputValue);
        const html = elementorJsonToHtml(elements);
        setOutputValue(html);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Conversion error';
      setError(errorMessage);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputValue);
  };

  const loadSample = () => {
    if (activeTab === 'html-to-json') {
      setInputValue('<div style="padding: 20px;"><h1 style="color: #333;">Hello</h1></div>');
    } else {
      setInputValue('[{"id":"abc","elType":"e-div-block","settings":{},"elements":[]}]');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Angie Elementor Converter</h1>
          <p className="text-gray-600">Convert between HTML and Elementor v4 Atomic JSON format</p>
        </div>

        <div className="flex gap-4 mb-6 justify-center">
          <button onClick={() => setActiveTab('html-to-json')} className={`px-6 py-3 rounded-lg font-semibold ${activeTab === 'html-to-json' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'}`}>HTML  JSON</button>
          <button onClick={() => setActiveTab('json-to-html')} className={`px-6 py-3 rounded-lg font-semibold ${activeTab === 'json-to-html' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'}`}>JSON  HTML</button>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-lg font-semibold text-gray-700">{activeTab === 'html-to-json' ? 'HTML Input' : 'JSON Input'}</label>
                <button onClick={loadSample} className="text-sm text-purple-600 hover:text-purple-700 font-medium">Load Sample</button>
              </div>
              <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-lg font-semibold text-gray-700">{activeTab === 'html-to-json' ? 'JSON Output' : 'HTML Output'}</label>
                {outputValue && <button onClick={handleCopy} className="text-sm text-purple-600 hover:text-purple-700 font-medium">Copy</button>}
              </div>
              <textarea value={outputValue} readOnly className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none bg-gray-50 focus:outline-none" />
            </div>
          </div>

          {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><strong>Error:</strong> {error}</div>}

          <div className="mt-6 text-center">
            <button onClick={handleConvert} disabled={!inputValue.trim()} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50">Convert</button>
          </div>
        </div>
      </div>
    </div>
  );
}