class City < ActiveRecord::Base
  include GeoKit::Geocoders

  validates_presence_of :name
  has_many :spots
  acts_as_mappable

  def origin
    [self.latitude, self.longitude]
  end

  def self.spots_within distance
    self.find :all, :origin => self.address, :conditions => "distance #{distance}"
  end

  def normalized_name
    name = self.name
    name.sub! ' ', '_'
    name.downcase!
  end

  def self.find_by_normalized_name name
    denormalized_name = name.sub '_', ' ' 
    denormalized_name.capitalize!
    self.find_by_name denormalized_name
  end
end
