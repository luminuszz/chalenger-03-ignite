import React from 'react';

interface IParams<IT> {
	key: string;
	InitialState: IT;
}

type IResponse<T> = [T, React.Dispatch<React.SetStateAction<T>>];

export default function usePersistState<T>({
	InitialState,
	key,
}: IParams<T>): IResponse<T> {
	const [state, setState] = React.useState(() => {
		const storageValue = localStorage.getItem(key);

		if (storageValue) {
			return JSON.parse(storageValue);
		}

		return InitialState;
	});

	React.useEffect(() => {
		localStorage.setItem(key, JSON.stringify(state));
	});

	return [state, setState];
}
