class Spot < ActiveRecord::Base
  include GeoKit::Geocoders
  validates_presence_of :name, :address
  belongs_to :city
  acts_as_mappable

  def location
    GoogleGeocoder.geocode self.address
  end

  def to_marker
    loc = self.location
    GMarker.new [loc.lat, loc.lng],
        :title => self.name,
        :info_window => "Info! Info!"
  end
  
  def to_no_info_marker
    loc = self.location
    GMarker.new [loc.lat, loc.lng],
        :title => self.name
  end

  # FIXME refactor, since it's repeated
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
