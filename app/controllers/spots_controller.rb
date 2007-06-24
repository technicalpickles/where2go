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

  def map
    # yeah, I know, I probably will ignore this anyway
    @spot = Spot.find(:first, :order => 'RAND()')
  end

  # stub for now, the view does all the fakery
  def queryjs
    # yeah, I know, I probably will ignore this anyway
    @spot = Spot.find(:first, :order => 'RAND()')
  end

  def show
    if params[:spot]
      @spot = Spot.find_by_normalized_name params[:spot]
    elsif params[:id]
      @spot = Spot.find(params[:id])
    end
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
end
