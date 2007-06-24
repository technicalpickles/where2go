
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
    @spots = @city.spots
    @origin = @city.origin
    @markers = collect_markers @city.spots

    build_map
  end

  def spots_by_distance
      if params[:lat] && params[:lng]
        @origin = [params[:lat].to_f, params[:lng].to_f]
      else
        @city = City.find_by_normalized_name params[:city]
        @origin = @city.origin
      end
      @city = City.find_by_normalized_name params[:city]

      @conditions = "distance < #{params[:distance]}";

      if params[:namefragment]
        @conditions += " AND name LIKE '%#{params[:namefragment]}%'";
      end

      @spots = Spot.find :all, :origin => @origin, :conditions => @conditions

      @markers = collect_markers @spots
      build_map

      respond_to do |wants|
        wants.html { render :action => :show }
        wants.js { render :action => :queryjs }
      end
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

  def map
    # yeah, I know, I probably will ignore this anyway
    @spot = Spot.find(:first, :order => 'RAND()')
  end

  # stub for now, the view does all the fakery
  def queryjs
    if params[:lat] && params[:lng]
      @origin = [params[:lat].to_f, params[:lng].to_f]
    else
      @city = City.find_by_normalized_name params[:city]
      @origin = @city.origin
    end
    @city = City.find_by_normalized_name params[:city]

    @conditions = "distance < #{params[:distance]}";

    if params[:namefragment]
      @conditions += " AND name LIKE '%#{params[:namefragment]}%'";
    end

    @spots = Spot.find :all, :origin => @origin, :conditions => @conditions

  end

  private
  def collect_markers spots
    @markers = spots.collect do |spot|
      spot.to_marker
    end
  end

  def build_map
    @map = GMap.new("map_div")
    @map.control_init(:large_map => true,:map_type => true)

    @map.center_zoom_init [@origin[0], @origin[1]], 12

    @markers.each do |marker|
      @map.overlay_init marker
    end
  end

end
