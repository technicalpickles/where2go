
class CitiesController < ApplicationController
  include GeoKit::Geocoders

  def title_prefix
    "City"
  end

  def index
    list
    render :action => 'list'
  end

  # GETs should be safe (see http://www.w3.org/2001/tag/doc/whenToUseGet.html)
  verify :method => :post, :only => [ :destroy, :create, :update ],
         :redirect_to => { :action => :list }

  def list
    @city_pages, @cities = paginate :cities, :per_page => 10
  end

  def show
    if params[:name]
      @city = City.find_by_normalized_name params[:name]
    elsif params[:id]
      @city = City.find(params[:id])
    end

    @markers = @city.spots.collect do |spot|
      spot.to_marker
    end

    build_map
  end

  def show_by_distance
      @city = City.find(params[:id])

  end

  def new
    @city = City.new
  end

  def create
    @city = City.new(params[:city])
    if @city.save
      flash[:notice] = 'City was successfully created.'
      redirect_to :action => 'list'
    else
      render :action => 'new'
    end
  end

  def edit
    @city = City.find(params[:id])
  end

  def update
    @city = City.find(params[:id])
    if @city.update_attributes(params[:city])
      flash[:notice] = 'City was successfully updated.'
      redirect_to :action => 'show', :id => @city
    else
      render :action => 'edit'
    end
  end

  def destroy
    City.find(params[:id]).destroy
    redirect_to :action => 'list'
  end

  private
  def lookup_location address
    GoogleGeocoder.geocode address
  end

  def build_map
    @map = GMap.new("map_div")
    @map.control_init(:large_map => true,:map_type => true)

    city_loc = lookup_location @city.name
    if city_loc.success
      @map.center_zoom_init [city_loc.lat, city_loc.lng], 12
    end

    @markers.each do |marker|
      @map.overlay_init marker
    end
  end

end
