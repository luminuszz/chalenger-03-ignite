import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
	children: ReactNode;
}

interface UpdateProductAmount {
	productId: number;
	amount: number;
}

interface CartContextData {
	cart: Product[];
	addProduct: (productId: number) => Promise<void>;
	removeProduct: (productId: number) => void;
	updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
	const [cart, setCart] = useState<Product[]>(() => {
		const response = localStorage.getItem('@RocketShoes:cart');

		if (!response) {
			return [];
		}
		return JSON.parse(response);
	});

	const setLocalStorages = (value: Product[]) => {
		const string = JSON.stringify(value);
		localStorage.setItem('@RocketShoes:cart', string);
	};

	const addProduct = async (productId: number) => {
		try {
			const { data: stock } = await api.get<Stock>(`stock/${productId}`);

			const currentCardIndex = cart.findIndex((item) => item.id === productId);

			if (currentCardIndex >= 0) {
				const cardCopy = [...cart];

				if (cardCopy[currentCardIndex].amount === stock.amount) {
					toast.error('Quantidade solicitada fora de estoque');

					return;
				}
				cardCopy[currentCardIndex].amount += 1;

				setLocalStorages(cardCopy);
				setCart(cardCopy);

				return;
			}
			const { data: product } = await api.get<Product>(`products/${productId}`);
			setCart([...cart, { ...product, amount: 1 }]);
			setLocalStorages([...cart, { ...product, amount: 1 }]);
		} catch (e) {
			toast.error('Erro na adição do produto');
		}
	};

	const removeProduct = (productId: number) => {
		try {
			const filteredArray = cart.filter(
				(currentProduct) => currentProduct.id !== productId
			);

			if (filteredArray.length === cart.length) {
				throw new Error('Erro na remoção do produto');
			}

			setCart(filteredArray);
			setLocalStorages(filteredArray);
		} catch (e) {
			toast.error(e.message);
		}
	};

	const updateProductAmount = async ({
		productId,
		amount,
	}: UpdateProductAmount) => {
		try {
			const { data } = await api.get<Stock>(`stock/${productId}`);

			if (amount <= 0) {
				return;
			}

			if (amount > data.amount) {
				return toast.error('Quantidade solicitada fora de estoque');
			}

			const findProductIndex = cart.findIndex(
				(product) => product.id === productId
			);

			const cartCopy = [...cart];

			cartCopy[findProductIndex].amount = amount;

			setCart(cartCopy);
			setLocalStorages(cartCopy);
		} catch {
			toast.error('Erro na alteração de quantidade do produto');
		}
	};

	return (
		<CartContext.Provider
			value={{ cart, addProduct, removeProduct, updateProductAmount }}
		>
			{children}
		</CartContext.Provider>
	);
}

export function useCart(): CartContextData {
	const context = useContext(CartContext);

	return context;
}
