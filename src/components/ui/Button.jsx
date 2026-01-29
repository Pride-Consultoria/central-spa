export default function Button({ children, variant = 'primary', size = 'md', ...props }) {
    const classes = [
        'ui-btn',
        `ui-btn--${variant}`,
        `ui-btn--${size}`,
        props.disabled ? 'is-disabled' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
}
