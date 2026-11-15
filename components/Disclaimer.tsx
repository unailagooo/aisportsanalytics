
import React from 'react';
import { WarningIcon } from './IconComponents';

export const Disclaimer: React.FC = () => {
  return (
    <footer className="bg-yellow-900/20 text-yellow-300 mt-12">
      <div className="container mx-auto p-6 text-center">
        <div className="flex justify-center items-center mb-2">
          <WarningIcon className="w-6 h-6 mr-2" />
          <h3 className="font-bold text-lg">Important Disclaimer</h3>
        </div>
        <p className="text-sm max-w-4xl mx-auto">
          This tool is for entertainment and informational purposes only. The predictions generated are based on AI analysis and are not guaranteed to be accurate. Sports betting involves significant financial risk. Please gamble responsibly and only wager what you can afford to lose. We are not responsible for any financial losses incurred based on the information provided by this application.
        </p>
      </div>
    </footer>
  );
};
