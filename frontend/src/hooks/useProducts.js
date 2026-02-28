import { useState, useEffect, useCallback } from 'react';
import { productsAPI } from '../api/index.js';

export function useProducts(initialParams = {}) {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await productsAPI.getAll({ ...initialParams, ...params });
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { products, pagination, isLoading, error, fetch };
}

export function useProduct(slug) {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    productsAPI.getBySlug(slug)
      .then(res => setProduct(res.data.product))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [slug]);

  return { product, isLoading, error };
}
