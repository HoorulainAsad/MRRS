export function Card({ children, className = '', as: Element = 'section', ...props }) {
  return (
    <Element
      className={`rounded-2xl border border-mist-200/90 bg-white shadow-soft ${className}`}
      {...props}
    >
      {children}
    </Element>
  );
}
