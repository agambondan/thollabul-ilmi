const Section = ({ children }) => {
    return (
        <section className='bg-gray-50 dark:bg-gray-950 pt-navbar pb-10 flex-1'>
            {children}
        </section>
    );
};

export default Section;
