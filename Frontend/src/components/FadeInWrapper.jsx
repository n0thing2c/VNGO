import { useInView } from 'react-intersection-observer';

export default function FadeInWrapper({ children, className = "" }) {
  const { ref, inView } = useInView({
    triggerOnce: true, // Only run animation once
    threshold: 0.1,    // Trigger when 10% of component is visible
  });

  return (
    <div
      ref={ref}
      className={`
        ${className}
        transition-all duration-1000 ease-in-out
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
      `}
    >
      {children}
    </div>
  );
}