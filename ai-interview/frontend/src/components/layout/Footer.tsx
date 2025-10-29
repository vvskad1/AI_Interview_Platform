import React from 'react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`w-full py-4 text-center text-sm text-gray-600 border-t border-gray-200 ${className}`}>
      <p>Created by <strong>Venkata Sai Krishna Aditya Vatturi</strong></p>
    </footer>
  );
};

export default Footer;