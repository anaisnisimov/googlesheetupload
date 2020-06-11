export const initialState = { items: [], itemsArtists: [] };

export const reducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_DATA':
            return {
                ...initialState,
                items: action.payload.data
            };
        case 'FETCH_DATA_ARTIST':
            return {
                ...initialState,
                itemsArtists: action.payload.genreArtist

            };
        default:
            throw new Error();
    }
}