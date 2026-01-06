/**
 * DisclaimerBanner Component
 * Displays a prominent medical disclaimer at the top of the application
 * Fixed position - always visible
 */

const DisclaimerBanner = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-100 border-b-2 border-amber-400 px-4 py-3 shadow-md">
      <div className="container mx-auto flex items-center justify-center">
        <p className="text-amber-800 text-sm md:text-base font-medium text-center">
          <span className="mr-2">⚠️</span>
          AI can make mistakes. This tool is for informational purposes only.
          Always consult a healthcare professional for medical advice.
        </p>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
