class City < ActiveRecord::Base
  validates_presence_of :name
  has_many :spots
  acts_as_mappable

  def nice_name
    name = self.name
    name.sub! ' ', '_'
    name.downcase!
  end
end
