import { forwardRef } from 'react';

export const DropdownContent = forwardRef(function DropdownContent(
    { children, widthClass = 'w-48', positionClass = 'absolute right-0 z-30 mt-2', className = '', ...props },
    ref,
) {
    const classes = [
        positionClass,
        widthClass,
        'rounded-lg border border-white/10 bg-[#0f172a] shadow-xl',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div ref={ref} className={classes} {...props}>
            {children}
        </div>
    );
});

export const DropdownItem = ({ as: Component = 'button', children, className = '', ...props }) => {
    const commonClasses = `w-full px-3 py-2 text-left text-sm font-semibold text-white hover:bg-white/5 flex items-center gap-2 ${className}`;
    if (Component === 'button') {
        return (
            <button type="button" className={commonClasses} {...props}>
                {children}
            </button>
        );
    }
    return (
        <Component className={commonClasses} {...props}>
            {children}
        </Component>
    );
};

export default {
    DropdownContent,
    DropdownItem,
};
