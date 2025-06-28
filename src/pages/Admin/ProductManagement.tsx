import React, { useState } from 'react';
import { ArrowLeft, Plus, Search, Filter, Edit, Trash2, Eye, Upload, Download, Package, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/toast';

interface ProductManagementProps {
  onBack: () => void;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  image: string;
  created: string;
  sku: string;
  description: string;
}

interface ProductForm {
  name: string;
  category: string;
  price: string;
  stock: string;
  description: string;
  image: string;
  status: 'active' | 'inactive';
}

export const ProductManagement = ({ onBack }: ProductManagementProps): JSX.Element => {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    category: 'Hoa tươi',
    price: '',
    stock: '',
    description: '',
    image: '',
    status: 'active'
  });

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Hoa hồng đỏ cao cấp',
      category: 'Hoa tươi',
      price: 299000,
      stock: 15,
      status: 'active',
      image: 'https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
      created: '15/01/2025',
      sku: 'FL001',
      description: 'Bó hoa hồng đỏ cao cấp được tuyển chọn từ những bông hoa tươi nhất'
    },
    {
      id: 2,
      name: 'Đồng hồ thông minh',
      category: 'Công nghệ',
      price: 2999000,
      stock: 5,
      status: 'active',
      image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
      created: '14/01/2025',
      sku: 'TC001',
      description: 'Đồng hồ thông minh với nhiều tính năng hiện đại'
    },
    {
      id: 3,
      name: 'Chocolate handmade',
      category: 'Đồ ăn',
      price: 450000,
      stock: 0,
      status: 'out_of_stock',
      image: 'https://images.pexels.com/photos/918327/pexels-photo-918327.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
      created: '13/01/2025',
      sku: 'FD001',
      description: 'Chocolate handmade cao cấp với hương vị đậm đà'
    },
    {
      id: 4,
      name: 'Nước hoa nữ cao cấp',
      category: 'Làm đẹp',
      price: 1200000,
      stock: 8,
      status: 'active',
      image: 'https://images.pexels.com/photos/1190829/pexels-photo-1190829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
      created: '12/01/2025',
      sku: 'BT001',
      description: 'Nước hoa nữ cao cấp với hương thơm quyến rũ'
    }
  ]);

  const categories = ['all', 'Hoa tươi', 'Công nghệ', 'Đồ ăn', 'Làm đẹp', 'Thời trang', 'Đồ trang sức'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Tạm dừng';
      case 'out_of_stock':
        return 'Hết hàng';
      default:
        return 'Không xác định';
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleDeleteSelected = () => {
    setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
    addToast({
      type: 'success',
      title: 'Đã xóa sản phẩm',
      description: `${selectedProducts.length} sản phẩm đã được xóa`,
      duration: 3000
    });
    setSelectedProducts([]);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description,
      image: product.image,
      status: product.status === 'out_of_stock' ? 'active' : product.status
    });
    setShowAddModal(true);
  };

  const handleDeleteProduct = (productId: number) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    addToast({
      type: 'success',
      title: 'Đã xóa sản phẩm',
      description: `Sản phẩm #${productId} đã được xóa`,
      duration: 3000
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock) {
      addToast({
        type: 'error',
        title: 'Thông tin chưa đầy đủ',
        description: 'Vui lòng điền đầy đủ thông tin sản phẩm',
        duration: 3000
      });
      return;
    }

    const price = parseInt(formData.price);
    const stock = parseInt(formData.stock);

    if (editingProduct) {
      // Update existing product
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? {
              ...p,
              name: formData.name,
              category: formData.category,
              price,
              stock,
              description: formData.description,
              image: formData.image || p.image,
              status: stock === 0 ? 'out_of_stock' : formData.status
            }
          : p
      ));
      
      addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        description: `Sản phẩm ${formData.name} đã được cập nhật`,
        duration: 3000
      });
    } else {
      // Add new product
      const newProduct: Product = {
        id: Math.max(...products.map(p => p.id)) + 1,
        name: formData.name,
        category: formData.category,
        price,
        stock,
        description: formData.description,
        image: formData.image || 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
        status: stock === 0 ? 'out_of_stock' : formData.status,
        created: new Date().toLocaleDateString('vi-VN'),
        sku: `SP${String(Math.max(...products.map(p => p.id)) + 1).padStart(3, '0')}`
      };

      setProducts(prev => [...prev, newProduct]);
      
      addToast({
        type: 'success',
        title: 'Thêm thành công',
        description: `Sản phẩm ${formData.name} đã được thêm`,
        duration: 3000
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Hoa tươi',
      price: '',
      stock: '',
      description: '',
      image: '',
      status: 'active'
    });
    setEditingProduct(null);
    setShowAddModal(false);
  };

  const handleInputChange = (field: keyof ProductForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 font-['Poppins',Helvetica]">
              Quản lý sản phẩm
            </h1>
            <div className="ml-auto flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
              <Button 
                className="bg-[#49bbbd] hover:bg-[#3a9a9c] text-white"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm sản phẩm
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                  <p className="text-2xl font-bold text-green-600">
                    {products.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hết hàng</p>
                  <p className="text-2xl font-bold text-red-600">
                    {products.filter(p => p.status === 'out_of_stock').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Giá trị kho</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatPrice(products.reduce((sum, p) => sum + (p.price * p.stock), 0))}
                  </p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#49bbbd]"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Tất cả danh mục' : category}
                  </option>
                ))}
              </select>
              
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Bộ lọc nâng cao
              </Button>

              {selectedProducts.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleDeleteSelected}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa ({selectedProducts.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-['Poppins',Helvetica]">
                Danh sách sản phẩm ({filteredProducts.length})
              </CardTitle>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onChange={handleSelectAll}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Chọn tất cả</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Sản phẩm</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Danh mục</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Giá</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Tồn kho</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="mr-2"
                          />
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">ID: {product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-sm">{product.sku}</td>
                      <td className="py-4 px-4 text-gray-600">{product.category}</td>
                      <td className="py-4 px-4 font-medium text-gray-900">{formatPrice(product.price)}</td>
                      <td className="py-4 px-4">
                        <span className={`${product.stock > 5 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(product.status)}`}>
                          {getStatusText(product.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 font-['Poppins',Helvetica]">
                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên sản phẩm *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nhập tên sản phẩm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Danh mục *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#49bbbd]"
                      required
                    >
                      {categories.slice(1).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá (VNĐ) *
                    </label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="Nhập giá sản phẩm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số lượng tồn kho *
                    </label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      placeholder="Nhập số lượng"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL hình ảnh
                  </label>
                  <Input
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    placeholder="Nhập URL hình ảnh sản phẩm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả sản phẩm
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Nhập mô tả sản phẩm..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#49bbbd]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#49bbbd]"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm dừng</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    className="bg-[#49bbbd] hover:bg-[#3a9a9c] text-white"
                  >
                    {editingProduct ? 'Cập nhật' : 'Thêm sản phẩm'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};