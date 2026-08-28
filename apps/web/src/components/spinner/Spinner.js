export const Spinner1 = (props) => {
    return (
        <div
            className={`${
                props.isProp === undefined ? "h-full" : "h-screen"
            } grid place-content-center`}
        >
            <div className='flex items-center text-gray-500'>
                <span className='h-20 w-20 block rounded-full border-4 border-t-0 border-r-0 border-blue-400 animate-spin text-2xl' />
                <span className='px-4'>Loading...</span>
            </div>
        </div>
    );
};

export const Spinner2 = () => {
    return (
        <div className='flex justify-center items-center space-x-2'>
            <div
                className='spinner-border animate-spin inline-block w-24 h-24 border-8 border-blue-400 border-b-0 border-t-0 rounded-full text-blue-600'
                role='status'
            ></div>
            <span className='visually-hidden'>Loading...</span>
        </div>
    );
};

export const Spinner3 = () => {
    return (
        <div className='flex items-center justify-center h-screen'>
            <div className='border-t-4 border-blue-500 border-solid rounded-full animate-spin h-16 w-16'></div>
        </div>
    );
};

export const Spinner4 = () => {
    return (
        <div className='absolute right-1/2 bottom-1/2 transform translate-x-1/2 translate-y-1/2 '>
            <div className='border-t-0 border-r-2 border-solid animate-spin rounded-full border-blue-400 border-8 h-64 w-64 text-5xl'></div>
        </div>
    );
};
