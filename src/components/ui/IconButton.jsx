export default function IconButton({ className = '', children, type = 'button', ...props }) {
    const classes = ['dash-icon-btn', className].filter(Boolean).join(' ');

    return (
        <button type={type} className={classes} {...props}>
            {children}
        </button>
    );
}
