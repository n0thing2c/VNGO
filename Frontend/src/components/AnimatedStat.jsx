import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

export default function AnimatedStat({ end, duration = 2, suffix = "", prefix = "" }) {
  const { ref, inView } = useInView({
    triggerOnce: true, // Chỉ đếm 1 lần
    threshold: 0.5,    // Đếm khi thấy 50%
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
        '0' // Hiển thị số 0 trước khi đếm
      )}
    </span>
  );
}