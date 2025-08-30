/**
 * Shopify E-commerce Optimization Example
 * 
 * This example demonstrates how to optimize a Shopify store for better performance,
 * customer experience, and sales using Nexus Integration SDK best practices.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle, TrendingUp, Package, Users, ShoppingCart, Settings } from 'lucide-react';

interface ProductOptimizationData {
  totalProducts: number;
  productsWithImages: number;
  productsWithDescriptions: number;
  productsWithTags: number;
  productsWithCollections: number;
  seoOptimizedProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

interface OrderFulfillmentData {
  totalOrders: number;
  pendingOrders: number;
  fulfilledOrders: number;
  averageFulfillmentTime: number;
  ordersWithTracking: number;
  returnRate: number;
  customerSatisfaction: number;
}

interface CustomerExperienceData {
  totalCustomers: number;
  repeatCustomers: number;
  averageOrderValue: number;
  cartAbandonmentRate: number;
  customerReviews: number;
  averageRating: number;
  customerSupportTickets: number;
}

export const ShopifyEcommerceOptimization: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [productData, setProductData] = useState<ProductOptimizationData | null>(null);
  const [fulfillmentData, setFulfillmentData] = useState<OrderFulfillmentData | null>(null);
  const [customerData, setCustomerData] = useState<CustomerExperienceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizationScore, setOptimizationScore] = useState(0);

  useEffect(() => {
    // Simulate loading data from Shopify integration
    const loadData = async () => {
      setLoading(true);
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProductData({
        totalProducts: 156,
        productsWithImages: 142,
        productsWithDescriptions: 134,
        productsWithTags: 98,
        productsWithCollections: 89,
        seoOptimizedProducts: 67,
        lowStockProducts: 12,
        outOfStockProducts: 3,
      });

      setFulfillmentData({
        totalOrders: 1247,
        pendingOrders: 23,
        fulfilledOrders: 1189,
        averageFulfillmentTime: 2.3,
        ordersWithTracking: 1156,
        returnRate: 4.2,
        customerSatisfaction: 4.6,
      });

      setCustomerData({
        totalCustomers: 892,
        repeatCustomers: 234,
        averageOrderValue: 89.50,
        cartAbandonmentRate: 23.4,
        customerReviews: 567,
        averageRating: 4.3,
        customerSupportTickets: 45,
      });

      // Calculate optimization score
      const productScore = calculateProductScore();
      const fulfillmentScore = calculateFulfillmentScore();
      const customerScore = calculateCustomerScore();
      
      setOptimizationScore(Math.round((productScore + fulfillmentScore + customerScore) / 3));
      setLoading(false);
    };

    loadData();
  }, []);

  const calculateProductScore = () => {
    if (!productData) return 0;
    
    const imageScore = (productData.productsWithImages / productData.totalProducts) * 100;
    const descriptionScore = (productData.productsWithDescriptions / productData.totalProducts) * 100;
    const tagScore = (productData.productsWithTags / productData.totalProducts) * 100;
    const collectionScore = (productData.productsWithCollections / productData.totalProducts) * 100;
    const seoScore = (productData.seoOptimizedProducts / productData.totalProducts) * 100;
    
    return Math.round((imageScore + descriptionScore + tagScore + collectionScore + seoScore) / 5);
  };

  const calculateFulfillmentScore = () => {
    if (!fulfillmentData) return 0;
    
    const fulfillmentRate = ((fulfillmentData.totalOrders - fulfillmentData.pendingOrders) / fulfillmentData.totalOrders) * 100;
    const trackingScore = (fulfillmentData.ordersWithTracking / fulfillmentData.fulfilledOrders) * 100;
    const satisfactionScore = (fulfillmentData.customerSatisfaction / 5) * 100;
    const returnScore = Math.max(0, 100 - (fulfillmentData.returnRate * 10));
    
    return Math.round((fulfillmentRate + trackingScore + satisfactionScore + returnScore) / 4);
  };

  const calculateCustomerScore = () => {
    if (!customerData) return 0;
    
    const repeatCustomerRate = (customerData.repeatCustomers / customerData.totalCustomers) * 100;
    const ratingScore = (customerData.averageRating / 5) * 100;
    const abandonmentScore = Math.max(0, 100 - (customerData.cartAbandonmentRate * 2));
    const supportScore = Math.max(0, 100 - (customerData.customerSupportTickets / customerData.totalCustomers * 100));
    
    return Math.round((repeatCustomerRate + ratingScore + abandonmentScore + supportScore) / 4);
  };

  const getOptimizationLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 75) return { level: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 60) return { level: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
  };

  const optimizationLevel = getOptimizationLevel(optimizationScore);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Shopify optimization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shopify E-commerce Optimization</h1>
          <p className="text-gray-600 mt-2">
            Optimize your Shopify store for better performance, customer experience, and sales
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{optimizationScore}%</div>
          <Badge className={optimizationLevel.color}>
            {optimizationLevel.level}
          </Badge>
        </div>
      </div>

      {/* Optimization Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Optimization Overview
          </CardTitle>
          <CardDescription>
            Your store's overall optimization score and key metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{calculateProductScore()}%</div>
              <div className="text-sm text-gray-600">Product Optimization</div>
              <div className="mt-2">
                {productData && (
                  <div className="text-xs text-gray-500">
                    {productData.totalProducts} products • {productData.seoOptimizedProducts} SEO optimized
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{calculateFulfillmentScore()}%</div>
              <div className="text-sm text-gray-600">Order Fulfillment</div>
              <div className="mt-2">
                {fulfillmentData && (
                  <div className="text-xs text-gray-500">
                    {fulfillmentData.averageFulfillmentTime} days avg • {fulfillmentData.customerSatisfaction}/5 satisfaction
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{calculateCustomerScore()}%</div>
              <div className="text-sm text-gray-600">Customer Experience</div>
              <div className="mt-2">
                {customerData && (
                  <div className="text-xs text-gray-500">
                    {customerData.totalCustomers} customers • {customerData.averageRating}/5 rating
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Optimize Product Catalog
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Review Order Fulfillment
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Improve Customer Experience
                </Button>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Top Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Product Images:</strong> {productData && (productData.totalProducts - productData.productsWithImages)} products need images
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>SEO Optimization:</strong> {productData && (productData.totalProducts - productData.seoOptimizedProducts)} products need SEO optimization
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Low Stock:</strong> {productData?.lowStockProducts} products are running low on stock
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Catalog Optimization</CardTitle>
              <CardDescription>
                Improve your product catalog for better discoverability and sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{productData.productsWithImages}</div>
                      <div className="text-sm text-gray-600">With Images</div>
                      <div className="text-xs text-gray-500">
                        {Math.round((productData.productsWithImages / productData.totalProducts) * 100)}% coverage
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{productData.productsWithDescriptions}</div>
                      <div className="text-sm text-gray-600">With Descriptions</div>
                      <div className="text-xs text-gray-500">
                        {Math.round((productData.productsWithDescriptions / productData.totalProducts) * 100)}% coverage
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{productData.productsWithTags}</div>
                      <div className="text-sm text-gray-600">With Tags</div>
                      <div className="text-xs text-gray-500">
                        {Math.round((productData.productsWithTags / productData.totalProducts) * 100)}% coverage
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{productData.seoOptimizedProducts}</div>
                      <div className="text-sm text-gray-600">SEO Optimized</div>
                      <div className="text-xs text-gray-500">
                        {Math.round((productData.seoOptimizedProducts / productData.totalProducts) * 100)}% coverage
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h4 className="font-semibold mb-3">Product Optimization Checklist</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">High-quality product images</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Detailed product descriptions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Relevant product tags</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Organized collections</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">SEO-optimized titles and descriptions</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Inventory Management</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                          <span className="text-sm">Low Stock Products</span>
                          <Badge variant="secondary">{productData.lowStockProducts}</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                          <span className="text-sm">Out of Stock</span>
                          <Badge variant="destructive">{productData.outOfStockProducts}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fulfillment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Fulfillment Optimization</CardTitle>
              <CardDescription>
                Streamline your order processing and fulfillment workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fulfillmentData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{fulfillmentData.totalOrders}</div>
                      <div className="text-sm text-gray-600">Total Orders</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{fulfillmentData.fulfilledOrders}</div>
                      <div className="text-sm text-gray-600">Fulfilled</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{fulfillmentData.pendingOrders}</div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{fulfillmentData.averageFulfillmentTime}</div>
                      <div className="text-sm text-gray-600">Avg Days</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Fulfillment Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Fulfillment Rate</span>
                          <span className="font-semibold">
                            {Math.round(((fulfillmentData.totalOrders - fulfillmentData.pendingOrders) / fulfillmentData.totalOrders) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Orders with Tracking</span>
                          <span className="font-semibold">
                            {Math.round((fulfillmentData.ordersWithTracking / fulfillmentData.fulfilledOrders) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Return Rate</span>
                          <span className="font-semibold">{fulfillmentData.returnRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Customer Satisfaction</span>
                          <span className="font-semibold">{fulfillmentData.customerSatisfaction}/5</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Optimization Recommendations</h4>
                      <div className="space-y-3">
                        {fulfillmentData.pendingOrders > 20 && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              High number of pending orders. Consider automating order processing.
                            </AlertDescription>
                          </Alert>
                        )}
                        {fulfillmentData.returnRate > 5 && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Return rate is above average. Review product descriptions and quality.
                            </AlertDescription>
                          </Alert>
                        )}
                        {fulfillmentData.averageFulfillmentTime > 3 && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Fulfillment time is slow. Optimize your shipping and processing workflows.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Experience Optimization</CardTitle>
              <CardDescription>
                Improve customer satisfaction and increase repeat purchases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customerData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{customerData.totalCustomers}</div>
                      <div className="text-sm text-gray-600">Total Customers</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{customerData.repeatCustomers}</div>
                      <div className="text-sm text-gray-600">Repeat Customers</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">${customerData.averageOrderValue}</div>
                      <div className="text-sm text-gray-600">Avg Order Value</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{customerData.averageRating}/5</div>
                      <div className="text-sm text-gray-600">Customer Rating</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Customer Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Repeat Customer Rate</span>
                          <span className="font-semibold">
                            {Math.round((customerData.repeatCustomers / customerData.totalCustomers) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Cart Abandonment Rate</span>
                          <span className="font-semibold">{customerData.cartAbandonmentRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Customer Reviews</span>
                          <span className="font-semibold">{customerData.customerReviews}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Support Tickets</span>
                          <span className="font-semibold">{customerData.customerSupportTickets}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Experience Improvements</h4>
                      <div className="space-y-3">
                        {customerData.cartAbandonmentRate > 20 && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              High cart abandonment rate. Consider implementing abandoned cart recovery.
                            </AlertDescription>
                          </Alert>
                        )}
                        {customerData.customerSupportTickets > 50 && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              High support ticket volume. Review product information and policies.
                            </AlertDescription>
                          </Alert>
                        )}
                        {(customerData.repeatCustomers / customerData.totalCustomers) < 0.3 && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Low repeat customer rate. Implement customer retention strategies.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline">Export Report</Button>
        <Button>Apply Optimizations</Button>
      </div>
    </div>
  );
};

export default ShopifyEcommerceOptimization;
