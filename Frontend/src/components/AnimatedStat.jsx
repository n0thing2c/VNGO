import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

export default function AnimatedStat({ end, duration = 2, suffix = "", prefix = "" }) {
  const { ref, inView } = useInView({
    triggerOnce: true, // Only count once
    threshold: 0.5,    // Count when 50% is visible
  });

  return (
    <span ref={ref}>
      {inView ? (
        <CountUp
          start={0}
          end={end}
          duration={duration}
          suffix={suffix}
          prefix={prefix}
        />
      ) : (
        '0' // Display 0 before counting
      )}
    </span>
  );
}