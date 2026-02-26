
export default function Footer() {
    return (
        <footer style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'transparent',
            marginTop: 'auto'
        }}>
            <p style={{
                color: 'var(--foreground)',
                opacity: 0.15,
                fontSize: '0.65rem',
                fontWeight: 900,
                letterSpacing: '0.3em',
                textTransform: 'uppercase'
            }}>
                &copy; {new Date().getFullYear()} REFLECT_OS // ALL_RIGHTS_RESERVED
            </p>
        </footer>
    );
}
