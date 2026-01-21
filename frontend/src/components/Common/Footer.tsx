export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">About This Tool</h3>
            <p className="text-sm text-gray-600">
              An AI-powered educational assistant to help parents and caregivers
              understand autism-related terminology.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Important Notice</h3>
            <p className="text-sm text-gray-600">
              This tool provides educational information only. It is not a
              substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Contact & Support</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>
                <a href="#faq" className="hover:text-primary-600">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#feedback" className="hover:text-primary-600">
                  Send Feedback
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-primary-600">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>
            © {currentYear} Autism Parent Assistant. All rights reserved.
          </p>
          <p className="mt-2">
            Made with care for the autism community.
          </p>
        </div>
      </div>
    </footer>
  );
}
