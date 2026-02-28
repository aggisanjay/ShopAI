import ProductCard from './ProductCard.jsx';
import { ProductCardSkeleton } from '../ui/Skeleton.jsx';
import { PackageOpen } from 'lucide-react';
import Button from '../ui/Button.jsx';

export default function ProductGrid({ products, isLoading, pagination, onPageChange }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array(12).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PackageOpen className="w-16 h-16 text-obsidian-600 mb-4" />
        <h3 className="text-lg font-medium text-obsidian-300">No products found</h3>
        <p className="text-sm text-obsidian-500 mt-1">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product, index) => (
          <ProductCard key={product._id} product={product} index={index} />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <Button
            variant="ghost"
            size="sm"
            disabled={!pagination.hasPrevPage}
            onClick={() => onPageChange?.(pagination.page - 1)}
          >
            ← Prev
          </Button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
              let page;
              if (pagination.totalPages <= 7) {
                page = i + 1;
              } else if (pagination.page <= 4) {
                page = i + 1;
              } else if (pagination.page >= pagination.totalPages - 3) {
                page = pagination.totalPages - 6 + i;
              } else {
                page = pagination.page - 3 + i;
              }

              return (
                <button
                  key={page}
                  onClick={() => onPageChange?.(page)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                    page === pagination.page
                      ? 'bg-gold-500 text-obsidian-900'
                      : 'glass text-obsidian-300 hover:text-white hover:bg-obsidian-700'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => onPageChange?.(pagination.page + 1)}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
