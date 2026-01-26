import { Key } from 'react'
import { supabase } from './supabaseClient'

export interface InventoryItem {
  id: Key | null | undefined
  quicklook_id: number
  ppo?: string
  station?: string
  type_parent?: string
  type_child?: string
  make_parent?: string
  make_child?: string
  serial_number?: string
  model?: string
  name?: string
  status?: string
  disposition?: string
  issuance_type?: string
  validated?: boolean
  // Add other fields as needed based on your schema
}

export interface CreateInventoryItem {
  ppo?: string
  station?: string
  type_parent?: string
  type_child?: string
  make_parent?: string
  make_child?: string
  serial_number?: string
  model?: string
  name?: string
  status?: string
  disposition?: string
  issuance_type?: string
  validated?: boolean
}

export interface UpdateInventoryItem extends Partial<CreateInventoryItem> {
  quicklook_id: number
}

class InventoryService {
  private tableName = 'quicklook_inventory_t'

  // Get all inventory items
  async getAllItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching inventory items:', error)
      throw new Error('Failed to fetch inventory items')
    }

    return data || []
  }

  // Get item by ID
  async getItemById(quicklook_id: number): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('quicklook_id', quicklook_id)
      .single()

    if (error) {
      console.error('Error fetching item:', error)
      return null
    }

    return data
  }

  // Create new item
  async createItem(item: CreateInventoryItem): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([item])
      .select()
      .single()

    if (error) {
      console.error('Error creating item:', error)
      throw new Error('Failed to create inventory item')
    }

    return data
  }

  // Update item
  async updateItem(item: UpdateInventoryItem): Promise<InventoryItem> {
    const { quicklook_id, ...updateData } = item;

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('quicklook_id', quicklook_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating item:', error)
      throw new Error('Failed to update inventory item')
    }

    return data
  }

  // Delete item
  async deleteItem(quicklook_id: number): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('quicklook_id', quicklook_id)

    if (error) {
      console.error('Error deleting item:', error)
      throw new Error('Failed to delete inventory item')
    }
  }

  // Update stock level - Note: This method may not be applicable to your schema
  // You may need to remove or modify this based on your actual schema
  async updateStock(quicklook_id: number, newValue: any): Promise<InventoryItem> {
    // This method needs to be adapted based on what field you want to update
    // For now, I'll make it generic - you may need to specify which field to update
    throw new Error('updateStock method needs to be adapted for your schema')
  }

  // Get items by category
  async getItemsByCategory(category: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('category', category)
      .order('name')

    if (error) {
      console.error('Error fetching items by category:', error)
      throw new Error('Failed to fetch items by category')
    }

    return data || []
  }

  // Search items
  async searchItems(query: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .order('name')

    if (error) {
      console.error('Error searching items:', error)
      throw new Error('Failed to search inventory items')
    }

    return data || []
  }

  // Get low stock items
  async getLowStockItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .filter('stock', 'lte', 'minStock')
      .gt('stock', 0)
      .order('stock')

    if (error) {
      console.error('Error fetching low stock items:', error)
      throw new Error('Failed to fetch low stock items')
    }

    return data || []
  }

  // Get out of stock items
  async getOutOfStockItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('stock', 0)
      .order('name')

    if (error) {
      console.error('Error fetching out of stock items:', error)
      throw new Error('Failed to fetch out of stock items')
    }

    return data || []
  }

  // Get inventory statistics
  async getInventoryStats() {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('stock, price, minStock, maxStock')

    if (error) {
      console.error('Error fetching inventory stats:', error)
      throw new Error('Failed to fetch inventory statistics')
    }

    if (!data) return { totalItems: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 }

    const totalItems = data.length
    const totalValue = data.reduce((sum, item) => sum + (item.stock * item.price), 0)
    const lowStockCount = data.filter(item => item.stock <= item.minStock && item.stock > 0).length
    const outOfStockCount = data.filter(item => item.stock === 0).length

    return {
      totalItems,
      totalValue,
      lowStockCount,
      outOfStockCount
    }
  }
}

export const inventoryService = new InventoryService()
