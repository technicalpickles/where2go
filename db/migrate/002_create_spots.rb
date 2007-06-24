class CreateSpots < ActiveRecord::Migration
  def self.up
    create_table :spots do |t|
      t.column :name, :string

      t.column :city_id, :integer

      t.column :latitude, :float
      t.column :longitude, :float

      t.column :address, :string
      t.column :phone, :string
    end
  end

  def self.down
    drop_table :spots
  end
end
