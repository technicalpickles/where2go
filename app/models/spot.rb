class Spot < ActiveRecord::Base
  validates_presence_of :name, :address
  acts_as_mappable
end
