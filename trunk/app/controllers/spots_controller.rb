class SpotsController < ApplicationController
  def title_prefix
    "Spots"
  end

  def index
    list
    render :action => 'list'
  end

  # GETs should be safe (see http://www.w3.org/2001/tag/doc/whenToUseGet.html)
  verify :method => :post, :only => [ :destroy, :create, :update ],
         :redirect_to => { :action => :list }

  def list
    @spot_pages, @spots = paginate :spots, :per_page => 10
  end

  def show
    @spot = Spot.find(params[:id])
    
    build_map
  end

  def new
    @spot = Spot.new
  end

  def create
    @spot = Spot.new(params[:spot])
    if @spot.save
      flash[:notice] = 'Spot was successfully created.'
      redirect_to :action => 'list'
    else
      render :action => 'new'
    end
  end

  def edit
    @spot = Spot.find(params[:id])
  end

  def update
    @spot = Spot.find(params[:id])
    if @spot.update_attributes(params[:spot])
      flash[:notice] = 'Spot was successfully updated.'
      redirect_to :action => 'show', :id => @spot
    else
      render :action => 'edit'
    end
  end

  def destroy
    Spot.find(params[:id]).destroy
    redirect_to :action => 'list'
  end
  
  def build_map
    @map = GMap.new("map")
    @map.control_init()
    loc = @spot.location
    @map.center_zoom_init [loc.lat, loc.lng], 15
    @map.overlay_init @spot.to_no_info_marker
    @map.interface_init(
          :dragging => false, 
          :info_window => false,
          :double_click_zoom => false, 
          :continuous_zoom => false)
  end
end
