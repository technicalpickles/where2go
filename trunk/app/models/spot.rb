class Spot < ActiveRecord::Base
  include GeoKit::Geocoders
  validates_presence_of :name, :address
  belongs_to :city
  acts_as_mappable :lat_column_name=> 'latitude', :lng_column_name=> 'longitude'

  def location
    if @location.nil?
      @location = GoogleGeocoder.geocode self.address
    end
    @location
  end


  def self.update_latlng_from_address
    self.find(:all).each do |spot|
      loc = spot.location
      spot.latitude = loc.lat
      spot.longitude = loc.lng
      spot.save!
    end
  end

  def to_marker
    
    info_str = "<font face=\"Arial\" color=\"#000000\">" +
        self.name + "<br>" + self.address + "<p>" +
        "<a href=\"" + self.city.name + "/spot/" + self.id.to_s + "\">Details...</a></font>"
      
         
    GMarker.new [self.latitude, self.longitude],
        :title => self.name,
        :info_window => info_str
  end
  
  def to_no_info_marker
    GMarker.new [self.latitude, self.longitude],
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
