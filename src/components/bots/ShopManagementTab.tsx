import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Category {
  id: number;
  name: string;
  description: string;
  emoji: string;
  sort_order: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  category_id: number;
}

interface ShopManagementTabProps {
  botId: string;
}

const ShopManagementTab = ({ botId }: ShopManagementTabProps) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  
  const [newCategory, setNewCategory] = useState({ name: '', description: '', emoji: '📦' });
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    stock_quantity: 0,
    category_id: 0,
  });

  const loadCategories = async () => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/7fad7f6c-0746-49e0-8f7a-5c0d526b6e7d?bot_id=${botId}&type=categories`
      );
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/7fad7f6c-0746-49e0-8f7a-5c0d526b6e7d?bot_id=${botId}&type=products`
      );
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [botId]);

  const handleCreateCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: 'Ошибка',
        description: 'Укажите название категории',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/7fad7f6c-0746-49e0-8f7a-5c0d526b6e7d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'category',
          bot_id: parseInt(botId),
          ...newCategory,
        }),
      });

      if (response.ok) {
        toast({ title: 'Категория создана' });
        setNewCategory({ name: '', description: '', emoji: '📦' });
        setShowCategoryDialog(false);
        loadCategories();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать категорию', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.category_id) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название и выберите категорию',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/7fad7f6c-0746-49e0-8f7a-5c0d526b6e7d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product',
          bot_id: parseInt(botId),
          ...newProduct,
        }),
      });

      if (response.ok) {
        toast({ title: 'Товар добавлен' });
        setNewProduct({
          name: '',
          description: '',
          price: 0,
          image_url: '',
          stock_quantity: 0,
          category_id: 0,
        });
        setShowProductDialog(false);
        loadProducts();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось добавить товар', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabsContent value="shop" className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Управление магазином</h3>
        <div className="flex gap-2">
          <Button onClick={() => setShowCategoryDialog(true)} variant="outline" size="sm">
            <Icon name="Plus" size={14} className="mr-2" />
            Категория
          </Button>
          <Button onClick={() => setShowProductDialog(true)} size="sm">
            <Icon name="Plus" size={14} className="mr-2" />
            Товар
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Icon name="FolderOpen" size={16} />
            Категории ({categories.length})
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id} className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Нет категорий. Создайте первую категорию.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Icon name="Package" size={16} />
            Товары ({products.length})
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {products.map((prod) => (
              <div key={prod.id} className="p-3 rounded-lg border bg-muted/30">
                <div className="flex gap-3">
                  {prod.image_url && (
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{prod.name}</p>
                    <p className="text-xs text-muted-foreground mb-1">{prod.description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-medium">{prod.price} ₽</span>
                      <span className="text-muted-foreground">
                        Остаток: {prod.stock_quantity} шт.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Нет товаров. Добавьте первый товар.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать категорию</DialogTitle>
            <DialogDescription>Добавьте новую категорию товаров</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Название</Label>
              <Input
                id="cat-name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Например: Одежда"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-emoji">Эмодзи</Label>
              <Input
                id="cat-emoji"
                value={newCategory.emoji}
                onChange={(e) => setNewCategory({ ...newCategory, emoji: e.target.value })}
                placeholder="📦"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Описание (опционально)</Label>
              <Textarea
                id="cat-desc"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Краткое описание категории"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreateCategory} disabled={loading}>
                {loading ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить товар</DialogTitle>
            <DialogDescription>Заполните информацию о товаре</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="prod-category">Категория *</Label>
              <Select
                value={newProduct.category_id.toString()}
                onValueChange={(value) =>
                  setNewProduct({ ...newProduct, category_id: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.emoji} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-name">Название *</Label>
              <Input
                id="prod-name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Например: Футболка черная"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-desc">Описание</Label>
              <Textarea
                id="prod-desc"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Подробное описание товара"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prod-price">Цена (₽) *</Label>
                <Input
                  id="prod-price"
                  type="number"
                  min="0"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-stock">Количество</Label>
                <Input
                  id="prod-stock"
                  type="number"
                  min="0"
                  value={newProduct.stock_quantity}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, stock_quantity: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-image">URL изображения</Label>
              <Input
                id="prod-image"
                type="url"
                value={newProduct.image_url}
                onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              {newProduct.image_url && (
                <img
                  src={newProduct.image_url}
                  alt="Preview"
                  className="w-32 h-32 rounded object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateProduct} disabled={loading}>
              {loading ? 'Добавление...' : 'Добавить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
};

export default ShopManagementTab;