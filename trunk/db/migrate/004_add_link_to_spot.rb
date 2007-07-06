class AddLinkToSpot < ActiveRecord::Migration
  def self.up
    add_column :spots, :link, :string
  end

  def self.down
    remove_column :spots, :link
  end
end
