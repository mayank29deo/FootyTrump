export default function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-gold text-navy-deep hover:brightness-105',
    secondary: 'bg-pitch text-white hover:brightness-110',
    ghost: 'bg-white/10 text-white hover:bg-white/20',
  }
  return <button className={`font-display font-bold tracking-wide px-5 py-2.5 rounded-xl transition disabled:opacity-50 ${styles[variant]} ${className}`} {...props} />
}
