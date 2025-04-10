import React, { useState, useEffect } from 'react';

/**
 * Clock component that displays the current date and time
 * @returns {JSX.Element} - Clock component
 */
const Clock = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    // Update the date every second
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000);

    // Clean up the interval on component unmount
    return () => {
      clearInterval(timer);
    };
  }, []);

  // Format the date and time
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <span>
      {formattedDate} • {formattedTime}
    </span>
  );
};

export default Clock;